import { kubectlStream } from './kubectl';
import * as fs from 'fs';

export const containerShell = (pod: string, namespace: string, shellType: string) => {
  const subProcess = kubectlStream(['exec', '-i', pod, '-n', namespace, '--', 'ash']);
  subProcess.stdout.pipe(process.stdout);
  subProcess.stderr.pipe(process.stderr);
  process.stdin.pipe(subProcess.stdin);

  return {
    cp(src: string, dist: string) {
      const content = fs.readFileSync(src, 'base64');
      subProcess.stdin.write(`echo "${content}" | base64 -d > ${dist}\n`);
    },
  };
};
