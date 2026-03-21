const db = require("../config/applicants");

db.prepare("DELETE FROM users").run();
db.prepare("DELETE FROM applicants").run();

const insertUser = db.prepare(`
  INSERT INTO users (username, password, role)
  VALUES (?, ?, ?)
`);

const insertApplicant = db.prepare(`
  INSERT INTO applicants (name, studentID, email, provisional_status, final_status)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run("coordinator", "password", "coordinator");

const applicants = [
  ["Alice Chen", "123456789", "alice@torontomu.ca", "Pending", "Pending"],
  ["Bob Singh", "234567890", "bob@torontomu.ca", "Accepted", "Pending"],
  ["Carol Nguyen", "345678901", "carol@torontomu.ca", "Rejected", "Pending"],
  ["David Kim", "456789012", "david@torontomu.ca", "Accepted", "Accepted"],
  ["Emma Patel", "567890123", "emma@torontomu.ca", "Rejected", "Rejected"]
];

for (const applicant of applicants) {
  insertApplicant.run(...applicant);
}

const applicantUsers = [
  ["123456789", "password", "applicant"],
  ["234567890", "password", "applicant"],
  ["345678901", "password", "applicant"],
  ["456789012", "password", "applicant"],
  ["567890123", "password", "applicant"]
];

for (const user of applicantUsers) {
  insertUser.run(...user);
}