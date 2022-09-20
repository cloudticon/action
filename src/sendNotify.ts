import { getCtCreds } from "./utils/setupCreds";
import axios from "axios";
import { context } from "./context";

export const sendNotify = async (e?: Error) => {
  const { discord } = getCtCreds();
  if (!discord) {
    return;
  }
  const name = `${context.project}/${context.repository} ${context.branch}`;
  const url = `https://github.com/${context.project}/${context.repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  if (e) {
    await sendDiscordMessage(discord.webhook, {
      color: 0xff0000,
      title: "Action failed",
      author: {
        name,
        url,
      },
      description: `@everyone 🤦 ${e.message}`,
      timestamp: new Date().toISOString(),
    });
  } else {
    await sendDiscordMessage(discord.webhook, {
      color: 0x7fff00,
      title: "Action success",
      author: {
        name,
        url,
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const sendDiscordMessage = (webhook: string, content: any) => {
  return axios.post(webhook, { embeds: [content] });
};
