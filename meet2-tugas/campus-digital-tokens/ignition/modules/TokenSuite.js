const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenSuiteModule", (m) => {
  console.log("🚀 Deploying Campus Digital Token Suite...");

  // Deploy ERC-20: CampusCredit
  const campusCredit = m.contract("CampusCredit");
  
  // Deploy ERC-721: StudentID
  const studentID = m.contract("StudentID");
  
  // Deploy ERC-1155: CourseBadge
  const courseBadge = m.contract("CourseBadge");
  
  // Skip initial setup to avoid address checksum issues
  // Setup can be done manually after deployment
  
  return { campusCredit, studentID, courseBadge };
});