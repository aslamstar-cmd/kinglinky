export default function botGuard(req, res, next) {
  const ua = (req.headers["user-agent"] || "").toLowerCase();

  const blocked = [
    "bot",
    "crawler",
    "spider",
    "headless",
    "curl",
    "python",
    "axios",
    "wget"
  ];

  if (blocked.some(b => ua.includes(b))) {
    return res.status(403).json({
      success: false,
      message: "Bot access blocked"
    });
  }

  next();
}