import {getConfig, getValidClientAndGroup} from "./utils";
import {Client} from "oicq";

const config = await getConfig();
const {client, group} = await getValidClientAndGroup(config.uid, config.targetGroup)

async function task(client: Client) {
    console.log("Executing format task");


    const mainRule = new RegExp(config.main.re);

    const members = await group.getMemberMap()
    const failedMembers: string[] = [];


    members.forEach((v, k) => {
        if (v.role !== "member") {
            return;
        }
        if (config.ignoreList?.includes(k)) {
            return;
        }

        const name = v.card || v.nickname;
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
        if (config.main.warn) {
            msg += config.main.warn;
        } else {
            msg += `正则：${config.main.re}`;
        }

        await client.sendGroupMsg(config.targetGroup, msg);
        process.exit(0);
    }
}

await task(client);

