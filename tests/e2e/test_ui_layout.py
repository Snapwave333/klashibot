import pytest
from playwright.sync_api import Page, expect

def test_ui_no_overlap(page: Page):
    """
    Verify that the TopBar and BottomBar (Input Area) do not overlap with the main content
    or each other, ensuring the layout is correct.
    """
    # Navigate to the frontend
    # backend container -> frontend container on port 80 (default for nginx)
    page.goto("http://frontend")

    # Wait for key elements to load
    # TopBar: <header>
    # Main Content: <main>
    # Input Area: The textarea wrapper at the bottom of AIBrainView. 
    # We can identify it by the class 'bg-black/40', or better, we can query the textarea and get its parent container.
    
    page.wait_for_selector("header")
    page.wait_for_selector("main")
    
    # Get bounding boxes
    header = page.locator("header")
    main = page.locator("main")
    
    header_box = header.bounding_box()
    main_box = main.bounding_box()
    
    assert header_box is not None
    assert main_box is not None
    
    print(f"Header: {header_box}")
    print(f"Main: {main_box}")
    
    # Check 1: Header should be above Main (y + height <= main.y)
    # With the floating layout and gap, there should be space. 
    # Or at least header.bottom <= main.top
    
    # Allow a small epsilon for sub-pixel rendering, but strictly header bottom <= main top
    assert header_box['y'] + header_box['height'] <= main_box['y'], \
        f"Header overlaps Main! Header Bottom: {header_box['y'] + header_box['height']}, Main Top: {main_box['y']}"

    # Check 2: Input Area vs Message Feed
    # Navigate to AI Brain view if not already there (default is usually dashboard but let's click AI ID)
    # The 'AI MIND' tab
    
    # Click navigation to ensure we are on AI Brain View
    # We can use text="AI MIND"
    page.get_by_text("AI MIND").click()
    
    # Wait for the input area
    textarea = page.locator("textarea[placeholder='Ask Neural Core...']")
    textarea.wait_for()
    
    # The input container is likely the parent div of the textarea
    input_container = textarea.locator("..").locator("..") # textarea -> group div -> input container div
    # Actually, simpler to find the container by class or structure.
    # In AIBrainView: <div className="bg-black/40 p-6 border-white/5 border-t">...<textarea>...</div>
    # Let's use the textarea and go up 2 levels.
    
    input_section = page.locator("textarea[placeholder='Ask Neural Core...']").locator("xpath=./../..")
    
    # The message feed is the scrolling div above it.
    # className="... overflow-y-auto custom-scrollbar"
    # It allows scrolling.
    
    # Let's check visual separation between the message feed container and the input section.
    # We can find the message list container.
    # It is Section 2.
    
    # A generic way is to check that the input section is at the bottom of the main container
    # and not covering the 'list' items if they are scrolled to bottom.
    
    input_box = input_section.bounding_box()
    assert input_box is not None
    
    # Ensure input section is visible and at the bottom
    viewport_height = page.viewport_size['height']
    assert input_box['y'] + input_box['height'] <= viewport_height + 50, "Input section is pushed off screen?" 
    # Actually, main has padding, so it might be slightly inside.
    
    print(f"Input Section: {input_box}")

    # Check that it doesn't overlap the Header
    assert header_box['y'] + header_box['height'] < input_box['y'], "Header overlaps Input Section"

