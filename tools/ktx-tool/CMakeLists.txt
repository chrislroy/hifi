set(TARGET_NAME ktx-tool)

setup_hifi_project(Quick Gui Concurrent)

link_hifi_libraries(shared networking image gl gpu ktx)

target_gli()

setup_memory_debugger()

if (WIN32)
  package_libraries_for_deployment()
endif()

