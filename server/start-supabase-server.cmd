@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-25.0.3"
set "SPRING_PROFILES_ACTIVE=supabase"
call gradlew.bat bootRun > supabase-boot.log 2>&1
