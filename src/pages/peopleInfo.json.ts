import people from "../peopleInfo.json";

export const GET = () =>
  new Response(
    JSON.stringify(people),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
