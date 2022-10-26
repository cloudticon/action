import { program } from 'commander';
program
  .command('logs')
  .option('--api-url <apiUrl>', '', 'https://builder.cloudticon.com')
  .option('--service <service>', '', )
  .action(getLogs);

type GetLogsParams = {
  service: string;
};
export async function getLogs({ service }: GetLogsParams) {
}
