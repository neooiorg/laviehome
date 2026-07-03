import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Laviehome Admin",
  version: packageJson.version,
  copyright: `© ${currentYear}, Laviehome.`,
  meta: {
    title: "Laviehome Admin",
    description: "Trang quản trị hệ thống đặt phòng Laviehome.",
  },
};
