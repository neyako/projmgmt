import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.analytics.deleteMany();
  await prisma.shotlistItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ─── USERS (6 team members) ─────────────────────────
  const talent = await prisma.user.create({ data: { name: "Alex Rivera", email: "alex@studio-os.net", role: "Talent" } });
  const manager = await prisma.user.create({ data: { name: "Jordan Park", email: "jordan@studio-os.net", role: "Manager" } });
  const cameraman = await prisma.user.create({ data: { name: "Sam Nguyen", email: "sam@studio-os.net", role: "Cameraman" } });
  const editorShorts = await prisma.user.create({ data: { name: "Dana Kim", email: "dana@studio-os.net", role: "Editor_Shorts" } });
  const editorFull = await prisma.user.create({ data: { name: "Morgan Chen", email: "morgan@studio-os.net", role: "Editor_FullStack" } });
  const talent2 = await prisma.user.create({ data: { name: "Riley Brooks", email: "riley@studio-os.net", role: "Talent" } });

  // ─── PROJECTS ───────────────────────────────────────
  // Ideation
  await prisma.project.create({ data: { title: "Tech Review: Desk Setup", contentType: "Organic", format: "Short_Form", status: "Ideation", platformsTargeted: '["YT_Shorts","TikTok"]', creatorId: talent.id, columnOrder: 0 } });
  await prisma.project.create({ data: { title: "Vlog: Tokyo Day 1", contentType: "Organic", format: "Long_Form", status: "Ideation", platformsTargeted: '["YouTube"]', creatorId: talent2.id, columnOrder: 1 } });

  // Scripting
  await prisma.project.create({ data: { title: "Keyboard ASMR Build", contentType: "Organic", format: "Short_Form", status: "Scripting", platformsTargeted: '["TikTok"]', creatorId: talent.id, aRollAssigneeId: talent.id, bRollAssigneeId: cameraman.id, columnOrder: 0 } });

  // Filming (with shotlist)
  const filmingProject = await prisma.project.create({ data: { title: "Studio Tour 2024", contentType: "Sponsored", format: "Long_Form", status: "Filming", platformsTargeted: '["YouTube"]', briefingNotes: "Client: TechGear Pro. Show the full studio setup.", creatorId: manager.id, aRollAssigneeId: talent.id, bRollAssigneeId: cameraman.id, aRollComplete: true, bRollComplete: false, storagePath: "\\\\truenas\\projects\\studio-tour-2024\\raw", aRollShots: JSON.stringify([{id:"a1",text:"Main talent intro",isCompleted:true},{id:"a2",text:"Studio walkthrough narration",isCompleted:true},{id:"a3",text:"Product showcase on desk",isCompleted:false}]), bRollShots: JSON.stringify([{id:"b1",text:"Desk detail shots",isCompleted:false},{id:"b2",text:"Camera gear b-roll",isCompleted:false},{id:"b3",text:"LED lighting sweep",isCompleted:true}]), columnOrder: 0 } });
  await prisma.shotlistItem.createMany({ data: [
    { label: "Desk detail shots", order: 0, completed: false, projectId: filmingProject.id },
    { label: "Camera gear b-roll", order: 1, completed: false, projectId: filmingProject.id },
    { label: "LED lighting sweep", order: 2, completed: true, projectId: filmingProject.id },
  ]});

  // Editing
  await prisma.project.create({ data: { title: "Camera Comparison: A7IV vs R6III", contentType: "Organic", format: "Long_Form", status: "Editing", platformsTargeted: '["YouTube"]', creatorId: talent.id, aRollAssigneeId: talent.id, bRollAssigneeId: cameraman.id, editingAssigneeId: editorFull.id, aRollComplete: true, bRollComplete: true, storagePath: "\\\\truenas\\projects\\camera-compare\\raw", reviewLink: "https://nc.studio.local/s/cameraAB", aRollShots: JSON.stringify([{id:"a1",text:"Intro and side-by-side",isCompleted:true},{id:"a2",text:"Low light test",isCompleted:true}]), bRollShots: JSON.stringify([{id:"b1",text:"Lens swaps",isCompleted:true},{id:"b2",text:"Slow-mo 120fps",isCompleted:true}]), columnOrder: 0 } });

  // Review
  await prisma.project.create({ data: { title: "Product Feature: Audio", contentType: "Product_Seeding", format: "Short_Form", status: "Review", platformsTargeted: '["Meta","TikTok"]', creatorId: manager.id, aRollAssigneeId: talent.id, bRollAssigneeId: cameraman.id, editingAssigneeId: editorShorts.id, aRollComplete: true, bRollComplete: true, reviewLink: "https://nc.studio.local/s/k8jH9fM2xQ", aRollShots: JSON.stringify([{id:"a1",text:"Unboxing talent",isCompleted:true}]), bRollShots: JSON.stringify([{id:"b1",text:"Product detail macro",isCompleted:true}]), columnOrder: 0 } });

  console.log("✓ Seed complete: 6 users, 6 projects");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
