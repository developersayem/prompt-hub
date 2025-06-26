import type{ Request } from 'express'
import multer from 'multer'
import path from "path";
import fs from "fs"


const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb:(error: Error | null, destination: string) => void) {
    const dir = path.join("public", "temp");

    // Create folder if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: function (req: Request, file:Express.Multer.File, cb:(error: Error | null, destination: string) => void) {
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)
     cb(null, file.originalname)
  }
})

export const upload = multer({ storage: storage })