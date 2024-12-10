
def solution(x):
# Write your code here
  return x*x

# Wrapper for test cases
def run_tests():
    results = []
    
    try:
        input_value = "5"
        expected_output = "25"
        user_output = str(solution(int(input_value.strip())))
        passed = user_output == expected_output
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": user_output,
            "passed": passed
        })
    except Exception as e:
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": str(e),
            "passed": False
        })
        

    try:
        input_value = "3"
        expected_output = "9"
        user_output = str(solution(int(input_value.strip())))
        passed = user_output == expected_output
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": user_output,
            "passed": passed
        })
    except Exception as e:
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": str(e),
            "passed": False
        })
        

    try:
        input_value = "-4"
        expected_output = "16"
        user_output = str(solution(int(input_value.strip())))
        passed = user_output == expected_output
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": user_output,
            "passed": passed
        })
    except Exception as e:
        results.append({
            "testCase": input_value,
            "expectedOutput": expected_output,
            "userOutput": str(e),
            "passed": False
        })
        
    return results

if __name__ == "__main__":
    import json
    results = run_tests()
    print(json.dumps(results, indent=4))
