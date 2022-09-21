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
      title: `${name} fail`,
      description: `@everyone [action](${url})`,
      timestamp: new Date().toISOString(),
    });
  } else {
    await sendDiscordMessage(discord.webhook, {
      color: 0x7fff00,
      title: `${name} success`,
      description: `[action](${url})`,
      timestamp: new Date().toISOString(),
    });
  }
};

export const sendDiscordMessage = (webhook: string, content: any) => {
  return axios.post(webhook, { embeds: [content] });
};
