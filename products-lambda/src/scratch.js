// Generate a unique id
const CUSTOMEPOCH = 1300000000000; // artificial epoch
const generateRowId = () => {
  let ts = new Date().getTime() - CUSTOMEPOCH; // limit to recent
  const randid = Math.floor(Math.random() * 512);
  ts = ts * 64; // bit-shift << 6
  return ts * 512 + (randid % 512);
};
