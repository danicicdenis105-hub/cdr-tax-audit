"""
Generate mock CDR data for Orange CAR based on real aggregated report patterns.
Output: CSV file ready for upload to TerraNode.
"""
import csv
import random
from datetime import datetime, timedelta

random.seed(42)

# Daily volumes from real Orange CAR PDF report (scaled ~100x down)
daily_data = [
    ("2023-08-31", 132, 6, 1),
    ("2023-09-01", 4689, 189, 27),
    ("2023-09-02", 2223, 106, 13),
    ("2023-09-03", 53, 2, 0),
    ("2023-09-04", 2494, 81, 13),
    ("2023-09-05", 4958, 179, 31),
    ("2023-09-06", 4935, 185, 31),
    ("2023-09-07", 4857, 215, 32),
    ("2023-09-08", 4581, 227, 34),
    ("2023-09-09", 4594, 223, 30),
]

# Orange subscribers (callers)
orange_subs = [f"72{random.randint(100000,999999)}" for _ in range(2000)]
orange_subs += [f"74{random.randint(100000,999999)}" for _ in range(500)]

# Destination pools per operator
orange_dests = [f"72{random.randint(100000,999999)}" for _ in range(3000)]
orange_dests += [f"74{random.randint(100000,999999)}" for _ in range(800)]
telecel_dests = [f"75{random.randint(100000,999999)}" for _ in range(500)]
telecel_dests += [f"76{random.randint(100000,999999)}" for _ in range(300)]
moov_dests = [f"70{random.randint(100000,999999)}" for _ in range(300)]

intl_prefixes = ["0033", "001", "00237", "00243", "00242", "00235", "002348"]


def gen_voice_amount(duration_sec, call_type):
    mins = max(1, duration_sec / 60)
    if "international" in call_type.lower() or "intl" in call_type.lower():
        return round(mins * random.uniform(60, 150))
    if "roaming" in call_type.lower():
        return round(mins * random.uniform(40, 90))
    return round(mins * random.uniform(18, 35))


output_path = r"C:\Users\Denis\Downloads\Orange_CAR_CDR_Mock_Data.csv"

with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "start_time", "call_type", "a_number", "b_number",
        "duration", "billed_duration", "data_usage_mb",
        "amount_ttc", "subscriber"
    ])

    total = 0
    for date_str, onnet, off_tel, off_moov in daily_data:
        base_date = datetime.strptime(date_str, "%Y-%m-%d")
        voice_total = onnet + off_tel + off_moov
        other_count = int(voice_total * 0.30)
        records = []

        # Voice On-Net (Orange -> Orange)
        for _ in range(onnet):
            caller = random.choice(orange_subs)
            dest = random.choice(orange_dests)
            ts = base_date + timedelta(seconds=random.randint(0, 86399))
            real_dur = max(1, int(random.gauss(88, 60)))
            billed_dur = int(real_dur * random.uniform(1.1, 1.4))
            amount = gen_voice_amount(billed_dur, "Voice Onnet")
            records.append([
                ts.strftime("%Y-%m-%d %H:%M:%S"), "Voice Onnet", caller, dest,
                real_dur, billed_dur, "", str(amount), caller
            ])

        # Voice Off-Net (Orange -> Telecel)
        for _ in range(off_tel):
            caller = random.choice(orange_subs)
            dest = random.choice(telecel_dests)
            ts = base_date + timedelta(seconds=random.randint(0, 86399))
            real_dur = max(1, int(random.gauss(58, 35)))
            billed_dur = int(real_dur * random.uniform(1.1, 1.3))
            amount = gen_voice_amount(billed_dur, "Voice Offnet")
            records.append([
                ts.strftime("%Y-%m-%d %H:%M:%S"), "Voice Offnet", caller, dest,
                real_dur, billed_dur, "", str(amount), caller
            ])

        # Voice Off-Net (Orange -> MOOV)
        for _ in range(off_moov):
            caller = random.choice(orange_subs)
            dest = random.choice(moov_dests)
            ts = base_date + timedelta(seconds=random.randint(0, 86399))
            real_dur = max(1, int(random.gauss(59, 35)))
            billed_dur = int(real_dur * random.uniform(1.1, 1.3))
            amount = gen_voice_amount(billed_dur, "Voice Offnet")
            records.append([
                ts.strftime("%Y-%m-%d %H:%M:%S"), "Voice Offnet", caller, dest,
                real_dur, billed_dur, "", str(amount), caller
            ])

        # Other service types (~30% of voice volume)
        for _ in range(other_count):
            r = random.random()
            caller = random.choice(orange_subs)
            ts = base_date + timedelta(seconds=random.randint(0, 86399))

            if r < 0.35:
                # SMS National
                dest = random.choice(orange_dests + telecel_dests + moov_dests)
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "SMS National", caller, dest,
                    "", "", "", "15", caller
                ])
            elif r < 0.45:
                # SMS International
                dest = random.choice(intl_prefixes) + str(random.randint(10000000, 99999999))
                amt = random.choice([25, 50, 75, 100])
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "SMS International", caller, dest,
                    "", "", "", str(amt), caller
                ])
            elif r < 0.65:
                # Data
                mb = round(random.uniform(0.5, 500), 1)
                amt = round(mb * random.uniform(0.3, 0.8))
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "Data", caller, "",
                    "", "", str(mb), str(amt), caller
                ])
            elif r < 0.75:
                # Incoming International
                origin = random.choice(intl_prefixes) + str(random.randint(10000000, 99999999))
                dur = max(1, int(random.gauss(120, 80)))
                billed = int(dur * random.uniform(1.1, 1.3))
                amt = gen_voice_amount(billed, "Incoming International")
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "Incoming International", origin, caller,
                    dur, billed, "", str(amt), caller
                ])
            elif r < 0.83:
                # Outgoing International
                dest = random.choice(intl_prefixes) + str(random.randint(10000000, 99999999))
                dur = max(1, int(random.gauss(90, 50)))
                billed = int(dur * random.uniform(1.1, 1.3))
                amt = gen_voice_amount(billed, "Outgoing International")
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "Outgoing International", caller, dest,
                    dur, billed, "", str(amt), caller
                ])
            elif r < 0.90:
                # Recharge
                amt = random.choice([500, 1000, 2000, 5000, 10000])
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "Recharge", caller, "",
                    "", "", "", str(amt), caller
                ])
            elif r < 0.96:
                # Subscription
                amt = random.choice([200, 500, 1000, 2500, 5000])
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "Subscription", caller, "",
                    "", "", "", str(amt), caller
                ])
            else:
                # Roaming Voice
                dest = random.choice(intl_prefixes) + str(random.randint(10000000, 99999999))
                dur = max(1, int(random.gauss(60, 30)))
                billed = int(dur * random.uniform(1.1, 1.3))
                amt = gen_voice_amount(billed, "Roaming Voice")
                records.append([
                    ts.strftime("%Y-%m-%d %H:%M:%S"), "Roaming Voice", caller, dest,
                    dur, billed, "", str(amt), caller
                ])

        random.shuffle(records)
        for rec in records:
            writer.writerow(rec)
            total += 1

print(f"Generated {total} mock CDR records")
print(f"Saved to: {output_path}")
