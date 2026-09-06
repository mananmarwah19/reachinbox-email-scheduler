import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

router.use((req, res, next) => {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  next();
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;

    const {
      email,
      displayName,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
    } = req.body;

    if (
      !email ||
      !smtpHost ||
      !smtpPort ||
      !smtpUser ||
      !smtpPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "email, smtpHost, smtpPort, smtpUser and smtpPassword are required",
      });
    }

    const sender = await prisma.sender.create({
      data: {
        userId,
        email,
        displayName: displayName || null,
        smtpHost,
        smtpPort: Number(smtpPort),
        smtpUser,
        smtpPassword,
      },
    });

    return res.status(201).json({
      success: true,
      sender: {
        id: sender.id,
        email: sender.email,
        displayName: sender.displayName,
        smtpHost: sender.smtpHost,
        smtpPort: sender.smtpPort,
        smtpUser: sender.smtpUser,
      },
    });
  } catch (error) {
    console.error("Failed to create sender:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create sender",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;

    const senders = await prisma.sender.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      senders,
    });
  } catch (error) {
    console.error("Failed to fetch senders:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch senders",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;

    const {
      email,
      displayName,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
    } = req.body;

    const existingSender = await prisma.sender.findFirst({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!existingSender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    const sender = await prisma.sender.update({
      where: {
        id: existingSender.id,
      },
      data: {
        ...(email !== undefined && { email }),
        ...(displayName !== undefined && { displayName }),
        ...(smtpHost !== undefined && { smtpHost }),
        ...(smtpPort !== undefined && { smtpPort: Number(smtpPort) }),
        ...(smtpUser !== undefined && { smtpUser }),
        ...(smtpPassword !== undefined && { smtpPassword }),
      },
    });

    return res.json({
      success: true,
      message: "Sender updated successfully",
      sender: {
        id: sender.id,
        email: sender.email,
        displayName: sender.displayName,
        smtpHost: sender.smtpHost,
        smtpPort: sender.smtpPort,
        smtpUser: sender.smtpUser,
      },
    });
  } catch (error) {
    console.error("Failed to update sender:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update sender",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;

    const sender = await prisma.sender.findFirst({
      where: {
        id: req.params.id,
        userId,
      },
    });

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender not found",
      });
    }

    await prisma.$transaction(async (tx) => {
  	await tx.email.deleteMany({
    	 where: {
      	  senderId: sender.id,
      	  userId,
    	},
     });

  	await tx.sender.delete({
    	 where: {
      	  id: sender.id,
    	},
      });
});
    return res.json({
      success: true,
      message: "Sender deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete sender:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete sender",
    });
  }
});

export default router;