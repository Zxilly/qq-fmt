import {getConfig, getValidClientAndGroup} from "./utils";

const config = await getConfig();
const {client,group} = await getValidClientAndGroup(config.uid, config.targetGroup)

const targetGroup = config.targetGroup;
const mainRule = new RegExp(config.main.re);
const mainWarn = config.main.warn;

if (!mainWarn) {
    console.error("应为 mainRule 设置 warn");
    process.exit(1);
}

const rulesList = config.rules?.map(r => {
    return {
        re: new RegExp(r.re),
        warn: r.warn
    }
}) ?? [];

client.on("notice.group.increase", async (e) => {
    const {user_id} = e;
    const member = group.pickMember(user_id);
    await member.sendMsg(`欢迎加入 ${group.name}，请注意群规，群名片应符合以下规则：\n${mainWarn}`);
})

client.on("message.private.group", async (e) => {
    const msg = e.raw_message.trim();

    const {group_id} = e.sender;
    if (group_id !== targetGroup) {
        return;
    }

    if (msg === "check") {
        const member = group.pickMember(e.user_id);
        const card = member.card || "";
        if (mainRule.test(card)){
            await member.sendMsg("合格");
        } else {
            let msg = "不合格，应符合以下规则：\n" + mainWarn;
            if (rulesList.length > 0) {
                msg += "额外规则：\n";
                for (const rule of rulesList) {
                    if (!rule.re.test(card)) {
                        if (rule.warn) {
                            msg += rule.warn + "\n";
                        } else {
                            msg += `正则：${rule.re}\n`;
                        }
                    }
                }
            }
            await member.sendMsg(msg);
        }
    } else {
        const member = group.pickMember(e.user_id);
        await member.sendMsg("命令不可用，当前可用的命令有\ncheck");
    }
})
