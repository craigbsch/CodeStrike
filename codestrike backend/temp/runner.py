import sys
from solution import solution  # Import the user's function dynamically

# Example input from stdin
input_data = sys.stdin.read().strip()
result = solution(int(input_data))  # Call the user's function
print(result)
