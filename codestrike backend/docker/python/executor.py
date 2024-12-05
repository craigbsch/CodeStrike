import sys
import subprocess
import time

def run_code(file_path, test_cases):
    results = []
    for test in test_cases:
        start_time = time.time()
        try:
            result = subprocess.run(
                ["python3", file_path],
                input=test['input'],
                text=True,
                capture_output=True,
                timeout=test['time_limit']
            )
            end_time = time.time()
            results.append({
                "test_case": test['input'],
                "output": result.stdout.strip(),
                "passed": result.stdout.strip() == test['expected_output'].strip(),
                "execution_time": end_time - start_time,
                "error": result.stderr if result.returncode != 0 else None
            })
        except subprocess.TimeoutExpired:
            results.append({"test_case": test['input'], "passed": False, "error": "Timeout"})
    return results

# Example test cases
if __name__ == "__main__":
    test_cases = [{"input": "5\n", "expected_output": "25\n", "time_limit": 2}]
    print(run_code("solution.py", test_cases))
