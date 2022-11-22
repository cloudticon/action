import * as fs from "fs";

const schema = JSON.parse(fs.readFileSync("kubernetes.json", "utf-8"));

const kubeSchema =
  schema.provider_schemas["registry.terraform.io/hashicorp/kubernetes"]
    .resource_schemas;

type TFBlock = {
  attributes?: Record<
    string,
    {
      type: string | string[];
      description_kind: string;
      optional: boolean;
      computed: boolean;
    }
  >;
  block_types?: Record<
    string,
    {
      nesting_mode: string;
      block: TFBlock;
    }
  >;
};
type TfResource = {
  version: number;
  block: TFBlock;
};

const parseBlock = (block: TFBlock, parent: string = "") => {
  let fields: any = [];

  if (block.attributes) {
    for (let [name, attr] of Object.entries(block.attributes)) {
      fields.push({
        name: `${parent}${name}`,
        type: attr.type,
      });
    }
  }

  if (block.block_types) {
    for (let [name, nested] of Object.entries(block.block_types)) {
      if (nested) {
        console.log(block.block_types);
        fields = [
          ...fields,
          {
            name,
            type: nested.nesting_mode,
            fields: parseBlock(nested.block, `${parent}${name}.`),
          },
        ];
      }
    }
  }

  return fields;
};

const parseResource = (resource: TfResource) => {
  const fields: any = parseBlock(resource.block);
  return fields;
};

console.log(
  JSON.stringify(parseResource(kubeSchema.kubernetes_ingress), null, 2)
);
