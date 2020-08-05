@echo on
::-------------------------------------------------------------------Firewall Reset (firewall works on XP,7,8+, advfirewall work on 7,8+)
netsh firewall reset
netsh advfirewall reset

::-------------------------------------------------------------------Disable Firewall (firewall works on XP,7,8+, advfirewall work on 7,8+)
netsh firewall set opmode mode=DISABLE profile=ALL
netsh advfirewall set allprofiles state off

::-------------------------------------------------------------------delete http cache
netsh nap reset
netsh rpc reset
netsh winhttp reset
netsh http flush
netsh http delete timeout timeouttype=idleconnectiontimeout
netsh http delete timeout timeouttype=headerwaittimeout

::-------------------------------------------------------------------make connection direct
netsh winhttp reset proxy

::-------------------------------------------------------------------disable tracing (default = disabled, ansi, 65535)
netsh winhttp reset tracing

::-------------------------------------------------------------------delete http cache

netsh http delete cache

::-------------------------------------------------------------------BranchCache Optimize WAN traffic (Windows Server 2008 R2 and Windows® 7)
netsh branchcache reset

::-------------------------------------------------------------------Routing Lists Clear
netsh routing reset

::-------------------------------------------------------------------Network-Adapter’s Software Default (Winsock Reset and Rebuild)
netsh winsock reset

::-------------------------------------------------------------------BranchCache is a new feature of Windows Server 2008 R2 and Windows® 7. BranchCache 
netsh interface ipv4 reset
netsh interface ipv6 reset

::-------------------------------------------------------------------Network-Interfaces Reset
netsh interface reset all

netsh interface httpstunnel reset


::-------------------------------------------------------------------Hardcore TCP/IP Reset and Rebuild
netsh int ip reset c:\temp\netsh_ip_reset_log.txt



exit 
::pause