import { getCtCreds } from "./utils/setupCreds";
import axios from "axios";
import { context, getGithubEvent } from "./context";

export const sendNotify = async (e?: Error) => {
  const { discord } = getCtCreds();
  if (!discord) {
    return;
  }
  const url = `https://github.com/${context.project}/${context.repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const event = getGithubEvent();
  const author = {
    name: event.sender.login,
    icon_url: event.sender.avatar_url,
    url: event.sender.url,
  };
  const fields = [
    {
      name: "commit",
      value: event.head_commit ? event.head_commit.message : "manual trigger",
    },
    {
      name: "action",
      value: `[${process.env.GITHUB_RUN_ID}](${url})`,
    },
  ];
  const provider = {
    name: "github",
    url: "https://github.com/",
  };
  const name = `${context.project}/${context.repository} ${context.branch}`;
  if (e) {
    await sendDiscordMessage(discord.webhook, {
      color: 0xff0000,
      title: `${name} fail`,
      description: `@everyone`,
      timestamp: new Date().toISOString(),
      fields,
      author,
      provider,
    });
  } else {
    await sendDiscordMessage(discord.webhook, {
      color: 0x7fff00,
      title: `${name} success`,
      timestamp: new Date().toISOString(),
      fields,
      author,
      provider,
    });
  }
};

export const sendDiscordMessage = (webhook: string, content: any) => {
  return axios.post(webhook, { embeds: [content] });
};
