from pathlib import Path
import os
import re
import shutil
import time

module_path = Path("src/messages/messages.module.ts")
messages_dir = Path("src/messages")

if not module_path.exists():
    raise SystemExit("❌ src/messages/messages.module.ts does not exist.")

backup = module_path.with_suffix(
    f".module.ts.bak-before-restore-real-messages-module-{time.strftime('%Y%m%d-%H%M%S')}"
)
shutil.copy2(module_path, backup)
print(f"✅ Backup created: {backup}")

controller_exists = Path("src/messages/messages.controller.ts").exists()
service_exists = Path("src/messages/messages.service.ts").exists()
gateway_exists = Path("src/messages/messages.gateway.ts").exists()

schema_exports = {}

for file in Path("src").rglob("*.schema.ts"):
    text = file.read_text(errors="ignore")

    for class_name in re.findall(r"export\s+class\s+(\w+)\b", text):
        schema_name = f"{class_name}Schema"
        if re.search(rf"export\s+const\s+{schema_name}\b", text):
            schema_exports[class_name] = file

needed_schema_classes = set()

for file in [
    Path("src/messages/messages.service.ts"),
    Path("src/messages/messages.controller.ts"),
    Path("src/messages/messages.gateway.ts"),
]:
    if not file.exists():
        continue

    text = file.read_text(errors="ignore")

    for match in re.findall(r"InjectModel\(\s*(\w+)\.name", text):
        needed_schema_classes.add(match)

    for match in re.findall(r"InjectModel\(\s*['\"]([^'\"]+)['\"]", text):
        if match in schema_exports:
            needed_schema_classes.add(match)

# Always include schemas inside src/messages/schemas because they belong to this module.
for class_name, file in schema_exports.items():
    if str(file).startswith("src/messages/schemas/"):
        needed_schema_classes.add(class_name)

missing = sorted([name for name in needed_schema_classes if name not in schema_exports])
if missing:
    print("⚠️ Could not find schema exports for:", ", ".join(missing))
    print("Continuing with schemas that were found.")

def import_path_from_messages_module(file: Path) -> str:
    without_ts = file.with_suffix("")
    rel = os.path.relpath(without_ts, module_path.parent).replace("\\", "/")
    if not rel.startswith("."):
        rel = "./" + rel
    return rel

imports = [
    "import { Module } from '@nestjs/common';",
]

schema_entries = []

if needed_schema_classes:
    imports.append("import { MongooseModule } from '@nestjs/mongoose';")

if controller_exists:
    imports.append("import { MessagesController } from './messages.controller';")

if service_exists:
    imports.append("import { MessagesService } from './messages.service';")

if gateway_exists:
    imports.append("import { MessagesGateway } from './messages.gateway';")

for class_name in sorted(needed_schema_classes):
    file = schema_exports.get(class_name)
    if not file:
        continue

    schema_name = f"{class_name}Schema"
    imports.append(
        f"import {{ {class_name}, {schema_name} }} from '{import_path_from_messages_module(file)}';"
    )
    schema_entries.append(f"      {{ name: {class_name}.name, schema: {schema_name} }},")

module_imports = ""
if schema_entries:
    module_imports = """  imports: [
    MongooseModule.forFeature([
%s
    ]),
  ],
""" % "\n".join(schema_entries)

controllers = []
if controller_exists:
    controllers.append("MessagesController")

providers = []
if service_exists:
    providers.append("MessagesService")
if gateway_exists:
    providers.append("MessagesGateway")

exports = []
if service_exists:
    exports.append("MessagesService")

def array_line(name, values):
    if not values:
        return ""
    return f"  {name}: [{', '.join(values)}],\n"

content = "\n".join(imports)
content += "\n\n"
content += "@Module({\n"
content += module_imports
content += array_line("controllers", controllers)
content += array_line("providers", providers)
content += array_line("exports", exports)
content += "})\n"
content += "export class MessagesModule {}\n"

module_path.write_text(content)

print("✅ Restored real MessagesModule.")
print("")
print("Registered:")
print("  controller:", controller_exists)
print("  service:", service_exists)
print("  gateway:", gateway_exists)
print("  schemas:", sorted(needed_schema_classes))
print("")
print("Inspect:")
print("cat src/messages/messages.module.ts")
