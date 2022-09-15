import {getConfig, getValidClientAndGroup, groupCheckAll} from "./utils";
import {Client} from "oicq";

const config = await getConfig();
const {group} = await getValidClientAndGroup(config.uid, config.target)

console.log("Executing format task");
await groupCheckAll(group);
process.exit(0);

