export const PRODUCT_SEEDS: Array<{
  code: string;
  name: string;
  description: string;
  roles: Array<{
    code: string;
    name: string;
    description: string;
  }>;
}> = [
  {
    code: "HR",
    name: "HR System",
    description: "Human resources management",
    roles: [
      {
        code: "HR_ADMIN",
        name: "HR Admin",
        description: "Full HR access",
      },
      {
        code: "HR_USER",
        name: "HR User",
        description: "Standard HR access",
      },
    ],
  },
];

export const SYSTEM_COMPANY = {
  name: "Suluhi",
  code: "SUL",
  email: "brianlwatati@gmail.com",
  phone: "+254705161125",
  description: "This is the company that develops the system",
};
