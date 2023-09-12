import logo from '@/assets/ccu-logo-black-500w.svgr';
import social from '@/assets/social.svgr';

const replacePlaceholders = (
  template: string,
  values: Record<string, string>,
) => {
  let result = template;

  for (const key in values) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, values[key]);
  }

  return result;
};

const handbillTemplate = `<div style="position: relative; width: 800px; height: 255px">
    <div
      style="position: absolute; background: black"
    >
      <svg width="40" height="250" xmlns="http://www.w3.org/2000/svg">
        <text x="-240" y="30" transform="rotate(-90)" font-size="23" fill="white">CRISISCLEANUP.ORG</text>
      </svg>
    </div>
    <div style="margin-left: 2.5rem; line-height: 18px">
      <div style="padding: 1rem 0.5rem; text-align: justify;">
        <div style="text-align: center; font-size: 1.75rem; font-weight: 1000;margin-bottom: 10px; line-height: 25px"">{{incident_name}} : <span style="white-space: nowrap">{{phone_number}}</span></div>
        <span style="font-size: 0.8rem;">{{assistance}}</span>
        <div style="display: grid; grid-template-rows: 1fr; grid-template-columns: repeat(4, 1fr); font-size: 0.875rem;">{{work_types}}</div>
        <div style="margin-top: 0.2rem; font-size: 0.8rem;">{{hotline_text}}</div>
        <div style="margin-top: 0.2rem; text-align: center; font-size: 0.65rem;">{{notes_text}}</div>
      </div>
    </div>
  </div>`;

const doorHangerTemplate = `<div style="position: relative; border-left: dotted 1px; border-right: dotted 1px; width: 400px; height: 800px;">
  <div style="margin-top: 1rem; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center;">
    <div style="position: relative; height: 144px; width: 144px;">
      <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; transform: translateX(-50%); border-left-style: dotted; border-left-width: 2px; border-color: #2d2d2d"></div>
      <div style="position: absolute; left: 0; right: 0; top: 50%; height: 1px; transform: translateY(-50%); border-top-style: dotted; border-top-width: 2px; border-color: #2d2d2d"></div>
    </div>
  </div>
  <div style="text-align: center; font-size: 1.25rem; font-weight: 800;">
    {{incident_name}} <br />
    {{phone_number}}
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
    <div style="display: flex; flex-direction: column; font-size: 0.875rem;">{{work_types}}</div>
    <div style="margin-top: 0.25rem; padding: 0.25rem; font-size: 0.75rem; text-align: center">{{hotline_text}}</div>
    <div style="display: flex; width: 100%; align-items: center; justify-content: center; padding: 0.75rem;">${logo}</div>
    <div style="display: flex; height: 100%; width: 100%; align-items: center; justify-content: center; background-color: #FFC947; text-align: center; font-size: 1.25rem; font-weight: 800; letter-spacing: 0.05em; color: black;">{{header}}</div>
     <div style="display: flex; flex-direction: column; align-items: center; justify-content: center">
      {{qr_code}}
      {{phone_number}}
    </div>
    <div style="margin-top: 0.75rem; padding: 0.25rem; text-align: center; font-size: 10px;">{{notes_text}}</div>
  </div>
</div>`;

const socialMediaTemplate = `<div style="position: relative; height: 100%; border-width: 1px; width: 600px; height: 375px">
    <div
      style="position: absolute; display: flex; height: 100%; width: 3rem; transform: scale(1); align-items: center; justify-content: center; background-color: #FDB44B; text-align: center; font-size: 1.5rem; font-weight: 800; color: black; writing-mode: vertical-rl;"
    >
      {{header}}
    </div>
    <div style="margin-left: 3rem;">
      <div style="display: flex; align-items: center; justify-content: center; padding: 3px; width: 100%;">${logo}</div>
      <div style="text-align: center; font-size: 1.7rem; font-weight: 1000;">{{incident_name}} {{phone_number}}</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); padding: 0.25rem; line-height: 18px">
        <div style="font-size: 0.875rem; grid-column: span 2;">
          <div>{{assistance}}</div>
          <div style="display: grid; grid-template-rows: 1fr; grid-template-columns: repeat(4, 1fr); font-size: 0.875rem;">{{work_types}}</div>
        </div>
        ${social}
      </div>
      <div style="margin-top: 0.25rem; font-size: 0.75rem; padding: 0.25rem;">{{hotline_text}}</div>
      <div style="margin-top: 0.75rem; text-align: center; padding: 0.25rem; font-size: 10px;">{{notes_text}}</div>
    </div>
  </div>`;

const pullTabFlyerTemplate = `<div style="position: relative; width: 800px; height: 1085px; margin: 0.25rem">
  <div style="display: flex; width: 100%; align-items: center; justify-content: center; padding: 3px;">${logo}</div>
  <div style="margin-bottom: 1rem; text-align: center; font-size: 2.5rem; font-weight: 1000;">{{incident_name}} <br>{{phone_number}}</div>
  <div style="text-align: center; display: flex; flex-direction: column; justify-content: space-between">
    <div><div style="font-size: 1.5rem;">{{assistance}}</div>
    <div style="display: grid; grid-template-rows: 1.2fr; grid-template-columns: repeat(4, 1fr); font-size: 1.5rem;">{{work_types}}</div>
    <div style="margin-top: 0.25rem; padding: 0.25rem; font-size: 1.5rem;">{{hotline_text}}</div>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center">
      {{qr_code}}
      {{phone_number}}
    </div>
    <div style="margin-top: 0.75rem; padding: 0.25rem; font-size: 1rem;">{{notes_text}}</div></div>
    <div style="position: absolute; bottom: 2.5rem; width: 100%"><div style="margin-top: 2rem; background-color: black; padding: 3px; text-align: center; font-size: 1.25rem; font-weight: 700; color: white;">{{header}}</div>
    <div style="display: grid; grid-template-columns: repeat(18, 1fr);">
      <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
            <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>
      <div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div><div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div><div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div><div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div><div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div><div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div><div style="writing-mode: vertical-rl; margin: 0.15rem 0; transform: scale(1); border-left-width: 1px; border-left-style: dotted; border-left-color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0rem; text-align: center; font-size: 0.75rem;">
        {{volunteer_help}}
        <div>{{phone_number}}</div>
      </div>

    </div></div>
  </div>
</div>`;

export {
  replacePlaceholders,
  handbillTemplate,
  socialMediaTemplate,
  pullTabFlyerTemplate,
  doorHangerTemplate,
};
