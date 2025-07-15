# ps aux

Shows all running processes.

## Options
a – all users  
u – show user  
x – include background processes

## Columns
USER – owner  
PID – process ID  
%CPU – CPU usage  
%MEM – RAM usage  
VSZ – virtual memory  
RSS – physical RAM  
TTY – terminal  
STAT – state  
START – start time  
TIME – CPU time used  
COMMAND – command run

## Examples
ps aux  
ps aux | grep ssh  
ps aux --sort=-%mem | head
