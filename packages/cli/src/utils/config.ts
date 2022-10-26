import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

class Config<T> {
  public fields: T = {} as T;

  constructor(public path: string) {
    this.load();
  }

  get(key: keyof T) {
    return this.fields[key];
  }

  getOrFail(key: keyof T) {
    const value = this.get(key);

    if (value) {
      return value;
    } else {
      throw new Error(`No value (${key as string})`);
    }
  }

  set(key: keyof T, value: any) {
    this.fields[key] = value;
    this.save();
  }

  save() {
    fs.writeFileSync(this.path, JSON.stringify(this.fields));
  }

  load() {
    if (fs.existsSync(this.path)) {
      this.fields = JSON.parse(fs.readFileSync(this.path, 'utf-8'));
    } else {
      // const p = this.path.split('/');
      // p.pop();
      // const dir = p.join('/');
      // fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.path, JSON.stringify({}));
      this.fields = {} as any;
    }
  }
}

type HomeConfig = {
  token: string;
};

let _homeConfig: Config<HomeConfig>;

export const homeConfig = () => {
  if (_homeConfig) {
    return _homeConfig;
  } else {
    _homeConfig = new Config<HomeConfig>(path.join(os.homedir(), '.config/cloudtcion'));
    return _homeConfig;
  }
};
