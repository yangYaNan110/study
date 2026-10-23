import "dotenv/config";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`缺少环境变量: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),

  jwtSecret: getRequiredEnv("JWT_SECRET"),

  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1h",
};
