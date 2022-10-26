import { program } from 'commander';
import { homeConfig } from './utils/config';

program
  .command('login')
  .requiredOption('-t, --token  <token>', 'cloudticon token')
  .action(async ({ token }) => {
    homeConfig().set('token', token);
  });
