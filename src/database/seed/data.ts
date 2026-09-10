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
  {
    code: "IAS",
    name: "IAS System",
    description: "Integrated application system",
    roles: [
      {
        code: "IAS_ADMIN",
        name: "IAS Admin",
        description: "Full IAS access",
      },
      {
        code: "IAS_USER",
        name: "IAS User",
        description: "Standard IAS access",
      },
    ],
  },
  {
    code: "RENTAL",
    name: "Rental System",
    description: "Rental management",
    roles: [
      {
        code: "RENTAL_ADMIN",
        name: "Rental Admin",
        description: "Full rental access",
      },
      {
        code: "RENTAL_USER",
        name: "Rental User",
        description: "Standard rental access",
      },
    ],
  },
  {
    code: "ERP",
    name: "ERP System",
    description: "Enterprise resource planning",
    roles: [
      {
        code: "ERP_ADMIN",
        name: "ERP Admin",
        description: "Full ERP access",
      },
      {
        code: "ERP_USER",
        name: "ERP User",
        description: "Standard ERP access",
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
