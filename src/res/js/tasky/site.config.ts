import type { ImageMetadata } from "astro";

interface Project {
  title: string;
  date: Date;
  link: string;
  image?: {
    light: ImageMetadata;
    dark: ImageMetadata;
  };
}

interface Link {
  [key: string]: string;
}

export interface Friend {
  name: string;
  link: string;
  image: string;
}

export interface Perusal {
  title: string;
  date: Date;
  description?: string;
  author?: string;
  url?: string;
}

export type Tag = {
  id: string;
  name: string;
};

export type SiteConfig = {
  title: string;
  description: string;
  links: Link;
  projects: Project[];
  friends: Friend[];
  tags: Tag[];
  persual: Perusal[];
};

export default {
  title: "tasky",
  description: "Shitposter by day, programmer by night.",
  links: {
    github: "taskyliz",
    bluesky: "tasky.uwu.network",
    rss: "https://tasky.uwu.network/posts/rss.xml",
  },
  tags: [
    { id: "stupidity", name: "Stupidity" },
    {
      id: "re",
      name: "Reverse Engineering",
    },
    { id: "mintlify", name: "Mintlify" },
  ],
  persual: [
    {
      title: "Radiant Computer",
      date: new Date("2025-11-08"),
      description:
        "Radiant is an ongoing research project in personal computing.",
      url: "https://radiant.computer/",
      author: "Alexis Sellier",
    },
  ],
  projects: [
    {
      title: "vivivi",
      link: "https://trunk.vivivi-647.pages.dev/",
      date: new Date("2025-06-07"),
      image: {
        light: {
          format: "webp",
          height: 1080,
          width: 1920,
          src: "/tasky/sites/vivivi.webp",
          orientation: 0,
        },
        dark: {
          format: "webp",
          height: 1080,
          width: 1920,
          src: "/tasky/sites/vivivi.webp",
          orientation: 0,
        },
      },
    },
    {
      title: "Wotaku",
      link: "https://wotaku.wiki/",
      date: new Date("2023-08-21"),
      image: {
        light: {
          format: "jpg",
          height: 1080,
          width: 1920,
          src: "/tasky/sites/wotaku-light.jpg",
          orientation: 0,
        },
        dark: {
          format: "jpg",
          height: 1080,
          width: 1920,
          src: "/tasky/sites/wotaku-dark.jpg",
          orientation: 0,
        },
      },
    },
    {
      title: "freemediaheckyeah",
      link: "https://fmhy.net/",
      date: new Date("2018-04-29"),
    },
    {
      title: "kanikou",
      link: "https://github.com/taskyliz/kanikou",
      description: "Personal discord bot for funsies.",
      date: new Date("2024-07-13"),
    },
    {
      title: "privateersclub",
      link: "https://megathread.pages.dev",
      date: new Date("2021-04-14"),
    },
  ],
  friends: [
    {
      name: "Alyxia",
      link: "https://alyxia.dev",
      image: "https://alyxia.dev/static/img/88x31/self.png",
    },
    {
      name: "Sketchie",
      link: "https://sketchni.uk",
      image: "https://sketchni.uk/images/sketch.png",
    },
    {
      name: "Sapphic",
      link: "https://sapphic.moe",
      image: "https://sapphic.moe/buttons/sapphic.png",
    },
    {
      name: "Basil",
      link: "https://basil.cafe",
      image: "https://sapphic.moe/buttons/friends/basil.gif",
    },
    {
      name: "Nax",
      link: "https://nax.dev",
      image: "https://alyxia.dev/static/img/88x31/nax.png",
    },
    {
      name: "maeve",
      link: "https://miaow.ing/",
      image: "https://alyxia.dev/static/img/88x31/maeve.png",
    },
    {
      name: "Ven",
      link: "https://vendicated.dev/",
      image: "https://sapphic.moe/buttons/friends/ven.png",
    },
    {
      name: "rushii",
      link: "https://rushii.dev",
      image: "https://sapphic.moe/buttons/friends/rushii.webp",
    },
    {
      name: "marsh",
      link: "https://marsh.zone/",
      image: "https://sapphic.moe/buttons/friends/marsh.png",
    },
    {
      name: "amy",
      link: "https://amy.rip/",
      image: "https://amy.rip/88x31.png",
    },
    {
      name: "paige",
      link: "https://codeberg.org/paige",
      image: "https://mugman.tech/88x31/paige.gif",
    },
    {
      name: "mugman",
      link: "https://mugman.tech/",
      image: "https://mugman.tech/88x31/me.gif",
    },
  ],
} as SiteConfig;
