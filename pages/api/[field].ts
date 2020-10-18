import fetchAgesData from "../../helpers/fetchAgesData";

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async (req, res) => {
  res.statusCode = 200;
  const {
    query: { field },
  } = req;
  const data = await fetchAgesData(field);
  res.json(data);
};
