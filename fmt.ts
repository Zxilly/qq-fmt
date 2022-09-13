import {createClient} from 'oicq';
import * as fs from 'fs';

type Rule = {
    re: string;
    warn: string | null;
}

type ConfigType = {
    uid: number;
    password: string;
    targetGroup: number;
    main: Rule;
    rules: Rule[] | null | undefined;
}

const config = JSON.parse(await fs.promises.readFile('config.json', 'utf-8')) as ConfigType;

const {uid, targetGroup, main, rules} = config as ConfigType;

if (!uid) {
    console.error("uid is required");
    process.exit(1);
}
if (!targetGroup) {
    console.error("targetGroup is required");
    process.exit(1);
}
if (!main) {
    console.error("mainRule is required");
    process.exit(1);
}

const client = createClient(uid)

await client.login();

client.on("system.login.qrcode", function (e) {
    process.stdin.once("data", async () => {
        await this.login()
    })
})

const allGroup = client.getGroupList()
if (!allGroup.has(targetGroup)) {
    console.error(`targetGroup ${targetGroup}`);
}

const group = client.pickGroup(targetGroup);

const mainRule = new RegExp(main.re);
const rulesList = rules?.map(r => {
    return {
        re: new RegExp(r.re),
        warn: r.warn
    }
}) ?? [];

const members = await group.getMemberMap()
const failedMembers: string[] = [];


members.forEach((v, k) => {
    if (v.role !== "member") {
        return;
    }
    const name = v.card;
    if (mainRule.test(name)) {
        return;
    } else {
        failedMembers.push(name);
    }
})

if (failedMembers.length > 0) {
    let msg =
        `以下成员的群名片不符合规范：\n` +
        failedMembers.join("\n") +
        '\n' +
        '合格的群名片应该符合以下规则：\n';
    if (main.warn) {
        msg += main.warn;
    } else {
        msg += `正则：${main.re}`;
    }
}

