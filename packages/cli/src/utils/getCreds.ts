import { checkAuth } from "./checkAuth";
import { homeConfig } from "./config";
import axios from "axios";

export const getCreds = () => {
  checkAuth();
  const token = homeConfig().get("token");
  return axios
    .get("https://auth.dev2.cloudticon.com/creds", {
      headers: {
        "x-api-key": token,
      },
    })
    .then((res) => res.data);
};
