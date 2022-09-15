import fs from "fs";
import {Client, createClient, Group, MemberInfo, segment} from "oicq";

type Rule = {
    re: string;
    warn: string;
}

type ConfigType = {
    uid: number;
    password: string | undefined;
    target: number;
    rule: Rule;
    ignore: number[] | null | undefined;
}

export async function groupCheckAll(group: Group) {
    const config = await getConfig();
    const members = await group.getMemberMap()
    const failedMembers: MemberInfo[] = [];
    const re = new RegExp(config.rule.re);

    members.forEach((v, k) => {
        if (v.role !== "member") {
            return;
        }
        if (config.ignore?.includes(k)) {
            return;
        }

        const name = v.card || "";
        if (re.test(name)) {
            return;
        } else {
            failedMembers.push(v);
        }
    })

    if (failedMembers.length > 0) {
        const msg = []
        msg.push(`以下成员的群名片不符合规范：\n`)
        for (const m of failedMembers) {
            msg.push(segment.at(m.user_id, '\n'))
        }
        let ruleText = "合格的群名片应该符合以下规则：\n" + config.rule.warn;

        msg.push(ruleText)

        await group.sendMsg(msg)
    } else {
        await group.sendMsg("所有成员的群名片均符合规范");
        return;
    }
}

export async function getValidClientAndGroup(uid: number, group: number, password: string | undefined = undefined): Promise<{ client: Client, group: Group }> {
    const client = createClient(uid, {
        platform: 3,
    })

    await client.login(password);

    if (!password) {
        client.on("system.login.qrcode", function () {
            const itid = setInterval(async () => {
                const ret = await this.queryQrcodeResult()
                if (ret.retcode === 0) {
                    itid && clearInterval(itid);
                    await client.qrcodeLogin()
                } else {
                    console.info("Still waiting for QR code scan")
                }
            }, 3000)
        })
    } else {
        client.on("system.login.slider", function (e) {
            console.log("输入ticket：")
            console.log(e.url)
            process.stdin.once("data", ticket => this.submitSlider(String(ticket).trim()))
        })

        client.on("system.login.device", function (e) {
            this.sendSmsCode()
            console.log("输入验证码：")
            console.log(e.url)
            process.stdin.once("data", code => this.submitSmsCode(String(code).trim()))
        })
    }

    await new Promise<void>((resolve) => {
        client.on("system.online", () => {
            resolve()
        })
    })
    const allGroup = client.getGroupList()
    if (!allGroup.has(group)) {
        console.error(`targetGroup ${group} not joined`);
    }

    const g = client.pickGroup(group);
    return {
        client, group: g
    }
}

let configCache: ConfigType | undefined = undefined

export async function getConfig(): Promise<ConfigType> {
    if (configCache) {
        return configCache;
    }
    const config = JSON.parse(await fs.promises.readFile('config.json', 'utf-8'));

    const {uid, target, rule} = config;

    if (!uid) {
        console.error("uid is required");
        process.exit(1);
    }
    if (!target) {
        console.error("target is required");
        process.exit(1);
    }
    if (!(typeof target === "number")) {
        console.error("target should be number");
        process.exit(1);
    }
    if (!rule) {
        console.error("rule is required");
        process.exit(1);
    }
    if (!(typeof rule === "object")) {
        console.error("rule should be object");
        process.exit(1);
    }
    if (!rule.re) {
        console.error("rule.re is required");
        process.exit(1);
    }
    if (!rule.warn) {
        console.warn("rule.warn is missing");
        rule.warn = `正则 ${rule.re}`;
    }
    configCache = config
    return config as ConfigType;
}

