import re
from typing import Tuple, Optional

def parse_salary_range(salary_str: str) -> Tuple[Optional[int], Optional[int]]:
    if not salary_str:
        return None, None

    try:
        cleaned = salary_str.lower()
        cleaned = cleaned.replace("$", "").replace(",", "").replace(" per year", "")
        cleaned = cleaned.replace("/year", "").replace("usd", "").replace(" a year", "")

        if "/hr" in cleaned or "per hour" in cleaned or "/hour" in cleaned:
            cleaned = cleaned.replace("/hr", "").replace("per hour", "").replace("/hour", "")
            numbers = re.findall(r'\d+\.?\d*', cleaned)
            if numbers:
                hourly_rate = float(numbers[0])
                annual = int(hourly_rate * 2080)  

                if 10 <= hourly_rate <= 100:
                    return annual, None
                else:
                    return None, None

        cleaned = cleaned.replace("k", "000")

        numbers = re.findall(r'\d+', cleaned)

        if len(numbers) >= 2:
            min_val, max_val = int(numbers[0]), int(numbers[1])

            if 10000 <= min_val <= 1000000 and 10000 <= max_val <= 1000000 and min_val <= max_val:
                return min_val, max_val
            else:
                return None, None
        elif len(numbers) == 1:
            val = int(numbers[0])

            if 10000 <= val <= 1000000:
                return val, None
            else:
                return None, None

    except Exception as e:
        print(f"Salary parse error: {e} for '{salary_str}'")

    return None, None