import fs from "fs";
import {Client, createClient, Group} from "oicq";

type Rule = {
    re: string;
    warn: string | null;
}

type ConfigType = {
    uid: number;
    password: string;
    targetGroup: number;
    main: Rule;
    ignoreList: number[] | null | undefined;
    rules: Rule[] | null | undefined;
}

export async function getValidClientAndGroup(uid: number, group: number): Promise<{ client: Client, group: Group }> {
    const client = createClient(uid)

    await client.login();

    client.on("system.login.qrcode", function () {
        const itid = setInterval(async () => {
            const ret = await this.queryQrcodeResult()
            if (ret.retcode === 0) {
                itid && clearInterval(itid);
            }
        }, 5000)
    })

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

export async function getConfig(): Promise<ConfigType> {
    const config = JSON.parse(await fs.promises.readFile('config.json', 'utf-8')) as ConfigType;

    const {uid, targetGroup, main} = config as ConfigType;

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

    return config;
}
