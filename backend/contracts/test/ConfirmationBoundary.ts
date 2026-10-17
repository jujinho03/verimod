import { expect } from "chai";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("T sender confirmation boundary", function () {
  it("does not let register-epoch claim F's trusted CONFIRMED state", function () {
    const script = readFileSync(fileURLToPath(new URL("../scripts/register-epoch.ts", import.meta.url)), "utf8");

    expect(script).to.not.include('state: "CONFIRMED"');
    expect(script).to.include('state: "SUBMITTED"');
    expect(script).to.include("awaiting F trusted confirmation after 12 confirmations");
  });
});
