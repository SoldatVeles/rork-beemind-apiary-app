import type { Tip } from "@/store/user-preferences-store";

export const BEGINNER_TIPS: Tip[] = [
  {
    id: "tip-1",
    title: "Regular Inspections",
    content: "Inspect your hives every 7-10 days during active season. Look for eggs, larvae, and the queen to ensure colony health.",
    category: "inspections",
    level: "beginner",
  },
  {
    id: "tip-2",
    title: "Understanding Brood Pattern",
    content: "A solid brood pattern (few empty cells) indicates a healthy, productive queen. Spotty patterns may signal problems.",
    category: "inspections",
    level: "beginner",
  },
  {
    id: "tip-3",
    title: "Varroa Mite Monitoring",
    content: "Check mite levels regularly. More than 3 mites per 100 bees requires treatment to prevent colony collapse.",
    category: "health",
    level: "beginner",
  },
  {
    id: "tip-4",
    title: "Seasonal Feeding",
    content: "Feed sugar syrup in spring to stimulate growth and in fall to prepare for winter. Check stores regularly.",
    category: "feeding",
    level: "beginner",
  },
  {
    id: "tip-5",
    title: "Yard Location",
    content: "Choose locations with morning sun, wind protection, good drainage, and away from high traffic areas.",
    category: "setup",
    level: "beginner",
  },
  {
    id: "tip-6",
    title: "Queen Marking",
    content: "Mark your queen with color codes by year. It helps find her quickly and track her age.",
    category: "queens",
    level: "intermediate",
  },
  {
    id: "tip-7",
    title: "Swarm Prevention",
    content: "Check for queen cells regularly in spring. Provide space and consider splits to prevent swarming.",
    category: "management",
    level: "intermediate",
  },
  {
    id: "tip-8",
    title: "Honey Extraction Timing",
    content: "Harvest when frames are 80% capped. Check moisture content - it should be below 18% for proper storage.",
    category: "harvest",
    level: "intermediate",
  },
  {
    id: "tip-9",
    title: "Record Keeping",
    content: "Detailed records help identify patterns, track genetics, and improve your beekeeping over time.",
    category: "management",
    level: "intermediate",
  },
  {
    id: "tip-10",
    title: "Winter Preparation",
    content: "Ensure adequate stores (15-20kg), reduce entrances, check ventilation, and consider insulation in cold climates.",
    category: "seasonal",
    level: "intermediate",
  },
];

export function getTipsForLevel(level: string): Tip[] {
  return BEGINNER_TIPS.filter(tip => {
    if (level === "beginner") return tip.level === "beginner";
    if (level === "intermediate") return tip.level === "beginner" || tip.level === "intermediate";
    return true;
  });
}
