import {getConfig, getValidClientAndGroup, groupCheckAll} from "./utils";
import {TextElem} from "oicq";

const config = await getConfig();
const {client, group} = await getValidClientAndGroup(config.uid, config.target, config.password)

const targetGroup = config.target;
const mainRule = new RegExp(config.rule.re);
const mainWarn = config.rule.warn;

client.on("message.group", async (e) => {
    if (e.group_id !== targetGroup) {
        return;
    }

    if (e.sender.role === 'member') {
        return;
    }

    if (!e.atme) {
        return;
    }

    if (e.message.length <= 1) {
        return;
    }

    const command = (e.message[1] as TextElem).text.trim().toLowerCase();

    if (command === 'help') {
        await client.sendGroupMsg(targetGroup, "当前支持的命令有：\n" +
            "help\n" +
            "checkAll\n" +
            "所有命令需要管理员权限"
        )
        return;
    } else if (command === 'checkall') {
        await groupCheckAll(group);
    }
})

client.on("message.private.group", async (e) => {
    const msg = e.raw_message.trim().toLowerCase();

    const {group_id} = e.sender;
    if (group_id !== targetGroup) {
        return;
    }

    if (msg === "check") {
        const member = group.pickMember(e.user_id);
        const card = member.card || "";
        if (mainRule.test(card)) {
            await member.sendMsg(`你的群名片 ${card} 合格`);
        } else {
            let msg = `你的群名片 ${card} 不合格，应符合规则：\n` + mainWarn;
            await member.sendMsg(msg);
        }
    } else {
        const member = group.pickMember(e.user_id);
        await member.sendMsg("命令不可用，当前可用的命令有\ncheck");
    }
})
