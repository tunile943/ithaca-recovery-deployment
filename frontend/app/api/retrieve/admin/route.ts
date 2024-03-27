import { IAdmin } from "../../../../util/models";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET = async (email: IAdmin["email"]) => {
  try {
    const user: (IAdmin | null) = await prisma.admin.findUnique({
      where: {
        email: email
      }
    });
    return user;
  }
  catch (error) {
    console.error("Admin not found: ", error);
    return null;
  }
}