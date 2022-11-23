import fs from "fs";

export function readContractAddress(path: any): string {
    const fs = require("fs");
    const contractsDir = __dirname + "/constants" + path;

    const stringJson = fs.readFileSync(contractsDir, "utf-8");
    return JSON.parse(stringJson).Token;
}