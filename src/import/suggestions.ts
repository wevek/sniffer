import { promises } from "fs";
import commander from "commander";
import { tsvToJSON } from "../libs/utils";
import mongoose from "mongoose";
import { Suggestions } from "../schemas";
import "dotenv/config";
const fileData = async () => {
  return await promises.readFile("files/cities_canada-usa.tsv");
};

const program = new commander.Command();

const mongoConnectionString = `${process.env.MONGODB_URI}${process.env.DB_NAME}`;

export const run = async () => {
  try {
    await mongoose.connect(mongoConnectionString);
  } catch (err) {
    console.log(err);
  }

  const data = await fileData();
  const jsonRes = tsvToJSON(data.toString());
  const d = new Date();
  while (jsonRes.length) {
    const chunk = jsonRes.splice(0, 100).filter((o) => o.name);
    const toInsert = chunk.map((o) => {
      return {
        name: o.name ? o.name : "",
        location: {
          type: "Point",
          coordinates: [parseFloat(o.long), parseFloat(o.lat)],
        },
        createdAt: d,
        updatedAt: d,
      };
    });

    const inserted = await Suggestions.insertMany(toInsert);
    console.log("Inserted : ", inserted);
  }

  console.log("All done!");

  process.exit(1);
};

program
  .version("1.0.1")
  .command("run")
  .description("Feed suggestions data in mongo")
  .action(async () => {
    await run();
  });

program.parse(process.argv);
