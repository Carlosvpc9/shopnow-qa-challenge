const major = Number(process.versions.node.split(".")[0]);
if (major < 22) {
  console.error(`\nShopNow requires Node 22 or later and you have Node ${process.versions.node}.`);
  console.error("Install the LTS version from https://nodejs.org or use Codespaces (see README).\n");
  process.exit(1);
}
