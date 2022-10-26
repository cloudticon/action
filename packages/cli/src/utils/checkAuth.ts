import {homeConfig} from "./config";

export const checkAuth = () => {
  if (!homeConfig().get('token')) {
    console.error('You need to run `ct login` first!');
    process.exit(1);
  }
}