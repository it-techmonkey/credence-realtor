/**
 * Team members - used on /team and About #team.
 * slug: URL path for profile page /team/[slug]
 */
export const TEAM_MEMBERS = [
  { slug: "ibrahim-bounil", name: "Ibrahim Bounil", img: "/team/ibrahim-bounil.jpeg", phone: "971589600053", email: "ibrahim.bounil@credencerealtor.com" },
  { slug: "esther-hrahsel", name: "Esther Hrahsel", img: "/team/esther-hrahsel.jpeg", phone: "971585220775", email: "esther.hrahsel@credencerealtor.com" },
  { slug: "albin-pr", name: "Albin PR", img: "/team/albin-pr.jpeg", phone: "971585722955", email: "albin.pr@credencerealtor.com" },
  { slug: "sadia-shaukat", name: "Sadia Shaukat", img: "/team/sadia-shaukat.jpeg", phone: "971559787029", email: "sadia.shaukat@credencerealtor.com" },
  { slug: "mai-sari-kozal", name: "Mai Sari Kozal", img: "/team/mai-sari-kozal.jpeg", phone: "971588919223", email: "mai.kozal@credencerealtor.com" },
  { slug: "anita-sisodiya", name: "Anita Sisodiya", img: "/team/anita-sisodiya.jpeg", phone: "971588919223", email: "anita.sisodiya@credencerealtor.com" },
  { slug: "naresh-singh", name: "Naresh Singh", img: "/team/naresh-singh.jpeg", phone: "971588919223", email: "naresh.singh@credencerealtor.com" },
  { slug: "muhammed-ali", name: "Muhammed Ali", img: "/team/muhammed-ali.jpeg", phone: "971552151598", email: "muhammed.ali@credencerealtor.com" },
  { slug: "sameer-mohammad", name: "Sameer Mohammad", img: "/team/sameer-mohammad.jpeg", phone: "971588919223", email: "sameer.mohammad@credencerealtor.com" },
  { slug: "mukesh-kumar", name: "Mukesh Kumar", img: "/team/mukesh-kumar.jpeg", phone: "971588919223", email: "mukesh.kumar@credencerealtor.com" },
  { slug: "prasad-nag", name: "Prasad Nag", img: "/team/prasad-nag.jpeg", phone: "971528573241", email: "prasad.nag@credencerealtor.com" },
  { slug: "amjad-hussain", name: "Amjad Hussain", img: "/team/amjad-hussain.jpeg", phone: "971585633420", email: "amjad.hussain@credencerealtor.com" },
  { slug: "pratibha-verma", name: "Pratibha Verma", img: "/team/pratibha-verma.jpeg", phone: "971588919223", email: "pratibha.verma@credencerealtor.com" },
  { slug: "rohit-shrivastava", name: "Rohit Shrivastava", img: "/team/rohit-shrivastava.jpeg", phone: "971564081600", email: "rohit.shrivastava@credencerealtor.com" },
  { slug: "rahul-kakoti", name: "Rahul Kakoti", img: "/team/rahul-kakoti.jpeg", phone: "971585436194", email: "rahul.kakoti@credencerealtor.com" },
  { slug: "neelam-rajput", name: "Neelam Rajput", img: "/team/neelam-rajput.jpeg", phone: "971522457210", email: "neelam.rajput@credencerealtor.com" },
  { slug: "kanchan-nagpure", name: "Kanchan Nagpure", img: "/team/kanchan-nagpure.jpeg", phone: "971585569796", email: "kanchan.nagpure@credencerealtor.com" },
];

export function getMemberBySlug(slug) {
  return TEAM_MEMBERS.find((m) => m.slug === slug) ?? null;
}
