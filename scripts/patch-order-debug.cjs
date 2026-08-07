/* TEMPORARY DEBUG: log the full error stack on order placement. */
const fs = require("fs");
const path = require("path");
const serverPath = path.join(__dirname, "..", "..", "dealroot-backend", "src", "server.js");

let code = fs.readFileSync(serverPath, "utf8");

const target = `  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Could not place your order",
    });
  } finally {`;

const replacement = `  } catch (error) {
    console.error("[ORDER-DEBUG] error.stack:", error && error.stack ? error.stack : String(error));
    res.status(400).json({
      success: false,
      message: error.message || "Could not place your order",
    });
  } finally {`;

if (!code.includes("[ORDER-DEBUG]")) {
  if (!code.includes(target)) throw new Error("target block not found");
  code = code.replace(target, replacement);
  fs.writeFileSync(serverPath, code);
  console.log("patched: order catch now logs stack");
} else {
  console.log("already patched");
}
