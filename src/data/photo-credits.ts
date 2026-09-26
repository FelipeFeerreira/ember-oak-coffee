/** Unsplash photo credits, shown in the footer and the README. */
export type PhotoCredit = {
  image: string;
  photographer: string;
  photoUrl: string;
};

const unsplash = (id: string) => `https://unsplash.com/photos/${id}`;

export const photoCredits: PhotoCredit[] = [
  { image: "Yirga Dawn", photographer: "NordWood Themes", photoUrl: unsplash("ivP3TYdLvw0") },
  { image: "Nyeri Ridge", photographer: "Alin Luna", photoUrl: unsplash("lGl3spVIU0g") },
  { image: "Huila Hearth", photographer: "Wojciech Pacześ", photoUrl: unsplash("OgJYC8q7QSE") },
  { image: "Antigua Ember", photographer: "pariwat pannium", photoUrl: unsplash("S8daAB_nJSg") },
  { image: "Ironwood Espresso", photographer: "Zarak Khan", photoUrl: unsplash("69ilqMz0p1s") },
  { image: "Old Growth Sumatra", photographer: "Tina Guina", photoUrl: unsplash("obV_LM0KjxY") },
  { image: "Night Shift Cold Brew", photographer: "Łukasz Rawa", photoUrl: unsplash("fmc-tFMMiBs") },
  { image: "Roaster's Tasting Flight", photographer: "Felipe Osorio", photoUrl: unsplash("Y3DDn_uv0Ig") },
  { image: "Morning Ritual Gift Box", photographer: "Stacy", photoUrl: unsplash("T3-2m-Xs7ZM") },
  { image: "Espresso Lover's Duo", photographer: "Sirius Harrison", photoUrl: unsplash("7lvQ7zBOyew") },
  { image: "Hearthstone Hand Grinder", photographer: "Ashkan Forouzani", photoUrl: unsplash("2AWQLHn7VLI") },
  { image: "Glass Pour-Over Brewer", photographer: "Erick Chévez", photoUrl: unsplash("yCcx7BXE7i8") },
  { image: "Home hero", photographer: "Scott Soltys-Curry", photoUrl: unsplash("_7CVm353m7A") },
  { image: "Brew bar", photographer: "Nathan Dumlao", photoUrl: unsplash("KixfBEdyp64") },
  { image: "Coffee cherries", photographer: "Eduardo Gorghetto", photoUrl: unsplash("vJ3KldG86Eo") },
  { image: "Roasting drum", photographer: "Scott Soltys-Curry", photoUrl: unsplash("7p4SmQtWFHU") },
  { image: "Fresh bag", photographer: "Nathan Dumlao", photoUrl: unsplash("PX1IrPsimHE") },
  { image: "About", photographer: "Tim Mossholder", photoUrl: unsplash("YC6RVdoTtIk") },
];
