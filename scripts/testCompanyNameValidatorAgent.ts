// write a script that tests the companyNameValidatorAgent

import { companyNameValidatorAgent } from "../src";

(async () => {
  const realCompanyName = await companyNameValidatorAgent("Apple"); // real company name
  const fakeCompanyName = await companyNameValidatorAgent("Apple123"); // fake company name

  console.log(realCompanyName);
  console.log(fakeCompanyName);
})();
