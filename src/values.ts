import { tfg } from "./tfg";
import { Variable } from "terraform-generator";
import * as fs from "fs";
import { context } from "./context";

console.log(context);
const allValues = JSON.parse(fs.readFileSync("values.json", "utf-8"));
const values = allValues[context.repository][context.branch];

export const variables: Record<string, Variable> = {};
Object.entries(values).forEach(([name, value]) => {
  variables[name] = tfg.variable(
    name,
    {
      type: "string",
    },
    value
  );
});
